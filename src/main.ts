import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

type SafeValidationError = {
  property: string;
  constraints?: Record<string, string>;
  children?: SafeValidationError[];
};

function toSafeValidationErrors(
  errors: ValidationError[],
): SafeValidationError[] {
  return errors.map((error) => ({
    property: error.property,
    constraints: error.constraints,
    children:
      error.children && error.children.length > 0
        ? toSafeValidationErrors(error.children)
        : undefined,
  }));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Inventory API')
    .setDescription('API для системы инвентаризации')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, swaggerDocument);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) =>
        new UnprocessableEntityException({
          statusCode: 422,
          message: 'Данные запроса не прошли валидацию',
          error: 'Unprocessable Entity',
          details: toSafeValidationErrors(errors),
        }),
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  await app.listen(process.env.PORT as string);
}
bootstrap();
