import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './modules/db/db.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { BranchesModule } from './modules/branches/manager/branches.module';
import { StaffModule } from './modules/staff/staff.module';
import { StaffSchedulesModule } from './modules/staff-schedules/staff-schedules.module';
import { StaffTimeOffModule } from './modules/staff-time-off/staff-time-off.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { ServicesModule } from './modules/services/services.module';
import { StaffServicesModule } from './modules/staff-services/staff-services.module';
import { AuthModule } from './modules/auth/manager/auth.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PublicPresenceModule } from './modules/public-presence/public-presence.module';
import { PublicModule } from './modules/public/public.module';
import { IaModule } from './modules/ia/ia.module';
import { RedisModule } from './modules/queues/redis/redis.module';
import { QueuesModule } from './modules/queues/queues.module';
import { BookingModule } from './modules/booking/booking.module';

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
    BookingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
