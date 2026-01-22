import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { BranchesModule } from './branches/branches.module';
import { StaffModule } from './staff/staff.module';
import { StaffSchedulesModule } from './staff-schedules/staff-schedules.module';
import { StaffTimeOffModule } from './staff-time-off/staff-time-off.module';
import { AvailabilityModule } from './availability/availability.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ClientsModule } from './clients/clients.module';
import { ServiceCategoriesModule } from './service-categories/service-categories.module';
import { ServicesModule } from './services/services.module';
import { StaffServicesModule } from './staff-services/staff-services.module';
import { AuthModule } from './auth/auth.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadsModule } from './uploads/uploads.module';
import { PublicPresenceModule } from './public-presence/public-presence.module';
import { PublicModule } from './public/public.module';
import { IaModule } from './ia/ia.module';
import { RedisModule } from './queues/redis/redis.module';
import { QueuesModule } from './queues/queues.module';
import { AvailabilityChainModule } from './core/availability-chain/availability-chain.module';

@Module({
  imports: [
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
    AvailabilityChainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
