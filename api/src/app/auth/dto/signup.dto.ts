import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'Freelancer',
    'JobSeeker',
    'Designer',
    'Developer',
    'Student',
    'Executive',
    'Professional',
    'Enterprise',
  ])
  persona?: string;
}


