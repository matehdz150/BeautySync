# AGENTS.md - apps/api

Este archivo define reglas y contexto para cualquier agente que trabaje dentro de `apps/api`.

## Alcance
- Aplica a todo el árbol de `apps/api`.
- Prioriza cambios mínimos, seguros y consistentes con el estilo existente.

## Stack y arquitectura
- Framework: NestJS (`@nestjs/*`) con TypeScript.
- Persistencia: Drizzle ORM + PostgreSQL.
- Mensajería y workers: BullMQ + Redis.
- Estructura dominante por módulo:
  - `application`: controllers, dto, handlers.
  - `core`: entidades de dominio, puertos, servicios, use-cases.
  - `infrastructure`: adapters/repositorios e integraciones.
- Inyección de dependencias por tokens (ver `core/ports/tokens.ts` por módulo).

## Reglas de implementación
- Mantén la lógica de negocio en `core/use-cases` y/o servicios de `core`.
- `application/controllers` solo orquesta entrada/salida y guards.
- Si agregas acceso a datos, crea/actualiza puerto en `core/ports` y su adapter en `infrastructure/adapters`.
- Reutiliza tipos y DTO existentes antes de crear nuevos.
- Evita mover o renombrar archivos públicamente consumidos sin validar referencias en web/api.
- No edites `dist/` manualmente.

## Autenticación y autorización

### Modelos de sesión
- Existen 2 contextos de autenticación:
  - `users` (staff/manager/owner/admin): autenticación JWT en cookies.
  - `publicUsers` (cliente final): sesión pública por cookie `pubsid` (o `PUBLIC_SESSION_COOKIE_NAME`).
- Nunca mezclar ambos contextos en el mismo endpoint/use-case.

### Cookies y tokens
- `users`:
  - Access token: cookie `accessToken` (validada por estrategia `jwt`).
  - Refresh token: cookie `refreshToken` con path `/auth/refresh` (estrategia `jwt-refresh`).
- `publicUsers`:
  - Session id: cookie `pubsid` por defecto (configurable con `PUBLIC_SESSION_COOKIE_NAME`).
  - TTL: `PUBLIC_SESSION_TTL_DAYS`.

### Guards HTTP
- `JwtAuthGuard`:
  - Úsalo para endpoints de panel interno (`users`).
  - Requiere cookie `accessToken` válida.
  - Deja el usuario autenticado en `req.user` (`AuthenticatedUser`).
- `RolesGuard`:
  - Úsalo junto con `JwtAuthGuard` cuando aplique control por rol.
  - Acompáñalo con `@Roles(...)`.
- `PublicAuthGuard`:
  - Úsalo para endpoints de cliente final autenticado (`publicUsers`).
  - Valida sesión desde cookie pública y expone `req.publicUser.publicUserId`.
- `BranchAccessGuard`:
  - Añádelo en rutas manager cuando el recurso depende de `branchId` en params.
  - Verifica que la sucursal pertenezca a la org del `req.user`.
- `OrganizationAccessGuard`:
  - Úsalo cuando la ruta/body/query recibe `organizationId` y se requiera validación de pertenencia.
- `RefreshJwtGuard`:
  - Solo para renovar access token en `/auth/refresh`.

### Guards y contexto GraphQL
- `GqlPublicAuthGuard`:
  - Contexto GraphQL con `publicUser` opcional.
  - Si no hay cookie de sesión pública, deja continuar (acceso anónimo).
  - Si hay cookie inválida, lanza `Unauthorized`.

### Decorators a usar
- `@CurrentUser()` para leer `req.user`.
- `@PublicUser()` para leer `{ publicUserId }` en endpoints HTTP públicos autenticados.
- `@GqlPublicUser()` para resolver `publicUserId` en GraphQL.
- No acceder a `req.user`/`req.publicUser` manualmente si ya existe decorator equivalente.

### Regla de controllers
- Endpoint de backoffice: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` cuando corresponda.
- Endpoint de cliente autenticado: `@UseGuards(PublicAuthGuard)` + `@PublicUser()`.
- Endpoint público anónimo: sin guard (o `GqlPublicAuthGuard` en GraphQL si quieres sesión opcional).
- El controller solo transforma inputs y delega; no meter reglas de acceso complejas ahí.

### Regla de use-cases (obligatoria)
- Aunque exista guard, el `use-case` debe validar autorización de dominio:
  - Para `users`: recibir `AuthenticatedUser` (o `userId/orgId` derivados) y validar pertenencia real a organización/sucursal/recurso.
  - Para `publicUsers`: recibir `publicUserId` y verificar ownership del recurso (booking, reward, gift card, etc).
- No confiar solo en `branchId`/`organizationId` enviados por cliente.
- Si el recurso no pertenece al actor autenticado, lanzar `ForbiddenException`.
- Si faltan credenciales/identidad esperada, lanzar `UnauthorizedException` o `ForbiddenException` según el caso.

### Mapa explícito: use-cases de auth y funciones de ports
- `LoginUseCase` (`manager/login.use-case.ts`):
  - `USERS_REPOSITORY.findByEmail(email)` para obtener usuario interno.
  - `PASSWORD_HASHER.compare(password, user.passwordHash)` para validar credenciales.
- `RegisterOwnerUseCase`:
  - `USERS_REPOSITORY.findByEmail(email)` para evitar duplicados.
  - `PASSWORD_HASHER.hash(password)` para almacenar hash seguro.
  - `USERS_REPOSITORY.create(...)` para crear owner.
- `RegisterAdminUseCase`:
  - `USERS_REPOSITORY.findByEmail(email)` para evitar duplicados.
  - `PASSWORD_HASHER.hash(password)`.
  - `USERS_REPOSITORY.create(...)`.
- `AcceptInviteUseCase`:
  - `INVITES_REPOSITORY.findByToken(token)` para validar invitación.
  - `STAFF_REPOSITORY.findById(invite.staffId)` para validar staff destino.
  - `BRANCHES_REPOSITORY.findById(staff.branchId)` para resolver `organizationId`.
  - `USERS_REPOSITORY.findByEmail(invite.email)` para reutilizar cuenta si existe.
  - `PASSWORD_HASHER.hash(password)` si hay que crear cuenta.
  - `USERS_REPOSITORY.create(...)` para alta de usuario invitado.
  - `STAFF_REPOSITORY.linkUser(staffId, userId)` para vincular identidad.
  - `INVITES_REPOSITORY.markAccepted(inviteId)` para cerrar invitación.
- `ValidateInviteUseCase`:
  - `INVITES_REPOSITORY.findByToken(token)`.
  - `STAFF_REPOSITORY.findById(invite.staffId)`.
  - `PUBLIC_BRANCHES_REPOSITORY.getSummaryById(staff.branchId)` para datos de contexto de UI.
- `LoginGoogleUseCase` (`public/login-google.use-case.ts`):
  - `GOOGLE_TOKEN_VERIFIER.verify(idToken)` para validar identidad Google.
  - `PUBLIC_USERS_REPOSITORY.findByGoogleSub(sub)` búsqueda principal.
  - `PUBLIC_USERS_REPOSITORY.findByEmail(email)` fallback de vinculación.
  - `PUBLIC_USERS_REPOSITORY.create(...)` si no existe.
  - `PUBLIC_USERS_REPOSITORY.updateLogin(userId, ...)` si existe.
  - `PUBLIC_SESSIONS_REPOSITORY.create(...)` para crear sesión pública.
- `GetUserBySessionUseCase`:
  - `PUBLIC_SESSIONS_REPOSITORY.findValid(sessionId)` para autenticar `publicUser`.
- `LogoutPublicUseCase`:
  - `PUBLIC_SESSIONS_REPOSITORY.delete(sessionId)` para invalidar sesión.

### Nota importante sobre strategies
- `JwtStrategy` y `JwtRefreshStrategy` actualmente validan usuario con acceso directo a `DB` (tabla `users`) y no via port.
- Si se refactoriza auth, preferir encapsular esa lectura en un port para mantener consistencia de arquitectura.

### Regla de repositorios/puertos
- Puertos que operan recursos sensibles deben aceptar identidad del actor (`user`, `userId`, `publicUserId`) cuando sea necesario para scoping.
- Evita consultas sin scope de tenant cuando el caso de uso es multi-tenant.

### Anti-patrones a evitar
- Usar `PublicAuthGuard` en endpoints manager o `JwtAuthGuard` en endpoints de cliente final.
- Resolver permisos solo con `@Roles` sin validar ownership del recurso en el `use-case`.
- Pasar `req` completo a `use-cases`; pasar solo datos mínimos (`user`, `publicUserId`, ids de recursos).
- Dejar `console.log` en guards/estrategias/controladores.

## Base de datos (Drizzle)
- Config: `src/modules/db/drizzle.config.ts`.
- Schema: `src/modules/db/schema`.
- Artefactos generados: carpeta `drizzle/`.
- Scripts:
  - `pnpm run db:generate`
  - `pnpm run db:migrate`
  - `pnpm run db:push`
- Si cambias schema, incluye migración/artefactos necesarios para reproducibilidad.

## Scripts útiles
- Desarrollo: `pnpm run start:dev`
- Build: `pnpm run build`
- Lint: `pnpm run lint`
- Tests: `pnpm run test`, `pnpm run test:e2e`, `pnpm run test:cov`
- Seeds/workers: revisar scripts en `package.json` (`seed`, `worker:*`).

## Calidad y validación
- Siempre ejecutar al menos:
  - `pnpm run lint`
  - tests del área afectada (mínimo `pnpm run test` si aplica)
- Si no puedes correr pruebas por entorno/tiempo, deja explícito qué faltó validar.

## Convenciones prácticas
- Usa imports absolutos con alias `src/*` cuando ya sea la convención del archivo.
- Mantén naming y carpetas existentes aunque haya inconsistencias históricas (evitar refactors amplios no solicitados).
- Evita logs de depuración (`console.log`) en código final.
- Respeta guards/decorators de auth según el tipo de actor (`users` vs `publicUsers`).

## Checklist al cerrar cambios
- El caso de uso compila y mantiene contrato de entrada/salida.
- Tokens DI, módulo y providers quedaron correctamente registrados.
- Cambios de DB acompañados por migración o instrucciones claras.
- Lint/test ejecutados o brechas reportadas.
- Si el cambio toca endpoints/auth:
  - Guard correcto aplicado (`JwtAuthGuard` o `PublicAuthGuard`).
  - `RolesGuard` + `@Roles` aplicado cuando corresponda.
  - `use-case` valida ownership/pertenencia aunque exista guard.
  - No se mezclan identidades (`req.user` vs `req.publicUser`) en el mismo flujo.
