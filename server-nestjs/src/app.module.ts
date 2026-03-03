import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { VendorsModule } from './vendors/vendors.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicingModule } from './invoicing/invoicing.module';
import { CollectionsModule } from './collections/collections.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CouponsModule } from './coupons/coupons.module';
import { ShippingModule } from './shipping/shipping.module';
import { OffersModule } from './offers/offers.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { ReportsModule } from './reports/reports.module';
import { ContentModule } from './content/content.module';
import { StoreReviewsModule } from './store-reviews/store-reviews.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { WalletsModule } from './wallets/wallets.module';
import { PointsModule } from './points/points.module';
import { GiftCardsModule } from './gift-cards/gift-cards.module';
import { InstallmentsModule } from './installments/installments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    VendorsModule,
    WishlistModule,
    CollectionsModule,
    MediaModule,
    NotificationsModule,
    PaymentsModule,
    InvoicingModule,
    ReviewsModule,
    CouponsModule,
    ShippingModule,
    OffersModule,
    ChatModule,
    AdminModule,
    AiModule,
    ReportsModule,
    ContentModule,
    StoreReviewsModule,
    WalletsModule,
    PointsModule,
    GiftCardsModule,
    InstallmentsModule,

    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      name: 'default',
      ttl: 60000,
      limit: 1000, // Increased for dashboard and seeding stability
    }, {
      name: 'auth',
      ttl: 60000,
      limit: 10, // Stricter for auth
    }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
