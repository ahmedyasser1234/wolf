
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/mail/mail.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const mailService = app.get(MailService);

    console.log('🧪 Testing MailService...');

    const testEmail = 'test@example.com';
    const testOrderNumber = 'ORD-TEST-12345';

    try {
        await mailService.sendOrderConfirmation(testEmail, testOrderNumber);
        console.log('✨ Test finished. Check logs above to see if it was sent or just logged.');
    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        await app.close();
    }
}

bootstrap();
