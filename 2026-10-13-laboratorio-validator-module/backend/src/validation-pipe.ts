import { BadRequestException, ValidationPipe, type ValidationPipeOptions } from '@nestjs/common';
import { type ValidationError } from 'class-validator';
import { languageManager, type MessageParams, RESOURCE_INVALID_KEY } from './model/messages';

export function createValidationPipe(): ValidationPipe {
  const options: ValidationPipeOptions = {
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestException(resolveMessages(errors)),
  };
  return new ValidationPipe(options);
}

function resolveMessages(errors: ValidationError[], params?: MessageParams): string[] {
  const messages: string[] = [];

  const walk = (errs: ValidationError[]) => {
    for (const error of errs) {
      if (error.constraints) {
        for (const [constraint, constraintMessage] of Object.entries(error.constraints)) {
          const context = resolveContext(error, constraint);
          messages.push(languageManager.resolve(constraintMessage as string, context ?? params));
        }
      }
      if (error.children?.length) walk(error.children);
    }
  };

  walk(errors);

  if (messages.length === 0) {
    messages.push(languageManager.resolve(RESOURCE_INVALID_KEY));
  }

  return messages;
}

function resolveContext(error: ValidationError, constraint: string): MessageParams | undefined {
  const context = error.contexts?.[constraint];
  if (!context || typeof context !== 'object') return undefined;
  return context as MessageParams;
}