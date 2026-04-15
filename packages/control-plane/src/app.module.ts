import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { InstancesModule } from './modules/instances/instances.module';
import { RoutingModule } from './modules/routing/routing.module';
import { ConnectorsModule } from './modules/connectors/connectors.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { ActionsModule } from './modules/actions/actions.module';
import { RuntimeModule } from './modules/runtime/runtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'great-koala',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    AuthModule,
    TenantsModule,
    InstancesModule,
    RoutingModule,
    ConnectorsModule,
    PoliciesModule,
    ActionsModule,
    RuntimeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
