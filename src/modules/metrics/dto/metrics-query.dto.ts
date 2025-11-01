import { IsOptional, IsDateString, IsMongoId, IsEnum } from 'class-validator';

export enum MetricsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  ALL = 'all',
}

export class MetricsQueryDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsEnum(MetricsPeriod)
  period?: MetricsPeriod = MetricsPeriod.MONTH;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
