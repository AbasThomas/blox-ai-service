import { IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { AiRoute, AssetType } from '@nextjs-blox/shared-types';

export class GenerateDto {
  @IsEnum(AssetType)
  assetType!: AssetType;

  @IsString()
  @MinLength(12)
  prompt!: string;

  @IsObject()
  context!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  preferredRoute?: AiRoute;
}


