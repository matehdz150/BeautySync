import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './modules/db/db.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { BranchesModule } from './modules/branches/branches.module';
import { StaffModule } from './modules/staff/staff.module';
import { StaffSchedulesModule } from './modules/staff-schedules/staff-schedules.module';
import { StaffTimeOffModule } from './modules/staff-time-off/staff-time-off.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { ServicesModule } from './modules/services/services.module';
import { StaffServicesModule } from './modules/staff-services/staff-services.module';
import { AuthModule } from './modules/auth/auth.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PublicPresenceModule } from './modules/public-presence/public-presence.module';
import { PublicModule } from './modules/public/public.module';
import { IaModule } from './modules/ia/ia.module';
import { RedisModule } from './modules/queues/redis/redis.module';
import { QueuesModule } from './modules/queues/queues.module';
import { BookingModule } from './modules/booking/booking.module';
import { RankingsModule } from './modules/rankings/rankings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagesModule } from './modules/messages/messages.module';
import { CacheModule } from './modules/cache/cache.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { GraphqlModule } from './graphql.module';
import { ExploreModule } from './modules/explore/explore.module';
import { ConfigModule } from '@nestjs/config';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ProductsModule } from './modules/products/products.module';
import { GiftCardsModule } from './modules/gift-cards/gift-cards.module';
import { CouponsModule } from './modules/cupons/cupons.module';
import { BenefitsModule } from './modules/benefits/benefits.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { RequestContextMiddleware } from './modules/metrics/request-context.middleware';

@Module({
  imports: [
    MetricsModule,
    DbModule,
    UsersModule,
    OrganizationsModule,
    BranchesModule,
    StaffModule,
    StaffSchedulesModule,
    StaffTimeOffModule,
    AvailabilityModule,
    AppointmentsModule,
    ClientsModule,
    ServiceCategoriesModule,
    ServicesModule,
    StaffServicesModule,
    AuthModule,
    OnboardingModule,
    PaymentsModule,
    UploadsModule,
    PublicPresenceModule,
    PublicModule,
    IaModule,
    RedisModule,
    QueuesModule,
    BookingModule,
    RankingsModule,
    NotificationsModule,
    MessagesModule,
    CacheModule,
    CalendarModule,
    GraphqlModule,
    ExploreModule,
    FavoritesModule,
    ProductsModule,
    GiftCardsModule,
    CouponsModule,
    BenefitsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
