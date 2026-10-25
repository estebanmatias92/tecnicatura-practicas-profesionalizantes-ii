import { Injectable } from '@nestjs/common';
import type { Clock } from '../../model/repositories/clock';

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
