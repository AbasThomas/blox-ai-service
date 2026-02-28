import { IsOptional, IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @IsString()
  @Length(6, 6)
  code!: string;

  @IsOptional()
  @IsString()
  challengeId?: string;
}


