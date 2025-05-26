import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { type Observable, switchMap } from 'rxjs';
import { ConfigService } from './config.service';
import { SrpClientService } from './srp-client.service';
import { environment } from '../../environment/environment';

export interface ChallengeResponse {
  b: string;
  salt: string;
}

export type Gender = 'MALE' | 'FEMALE';

interface UserBaseModel {
  firstName: string;
  lastName: string;
  gender: Gender;
  email: string;
  phoneNumber: string;
  country: string;
  city: string;
  zipCode: string;
  address?: string;
  password?: string;
}

export interface CreateUserRequest extends UserBaseModel {
  verifier: string;
  salt: string;
}

export interface CreateUserResponse extends UserBaseModel {
  id: string;
  status: string;
  role: string;
}

export interface ValidateOTPRequest {
  email: string;
  otp: string;
  id: string;
}

export interface ValidateOTPError {
  code: number;
  status: ValidateOTPErrorMessages;
}

export type ValidateOTPErrorMessages =
  | 'OTP_EXPIRED'
  | 'INVALID_OTP'
  | 'invalid_mail_format'
  | 'empty_email'
  | 'empty_opt';

@Injectable({ providedIn: 'root' })
export class SignUpApiService {
  private httpClient = inject(HttpClient);
  private configService = inject(ConfigService);
  private srpClientService = inject(SrpClientService);

  generateVerifierAndSalt(email: string): Observable<ChallengeResponse> {
    return this.httpClient.post<ChallengeResponse>(
      `${this.configService.serverUrl}/v1/auth/srp/challenge`,
      { email },
    );
  }

  createUser(user: UserBaseModel): Observable<CreateUserResponse> {
    return this.generateVerifierAndSalt(user.email).pipe(
      switchMap((challenge) => {
        const userReq: CreateUserRequest = user as CreateUserRequest;
        const srpClient = this.srpClientService.srpClient();

        userReq.salt = challenge.salt;
        userReq.verifier = srpClient.generateVerifier(
          challenge.salt,
          user.email,
          user.password,
        );
        return this.httpClient.post<CreateUserResponse>(
          `${this.configService.serverUrl}/v1/users/registration`,
          userReq,
          { headers: { 'ADMIN-Customer-ID': environment.customerId } },
        );
      }),
    );
  }

  resendOTP(email: string): Observable<void> {
    return this.httpClient.post<void>(
      `${this.configService.serverUrl}/v1/users/registration/otp/resend`,
      { email },
    );
  }

  validateOTP(req: ValidateOTPRequest): Observable<void> {
    return this.httpClient.post<void>(
      `${this.configService.serverUrl}/v1/users/registration/otp/validate`,
      req,
    );
  }
}
