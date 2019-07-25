import { Action } from '@ngrx/store';
import { KeyModel } from '../../models/key.model';
import { ServiceModel } from '../../models/service.model';

export const ADD_AUTHENTICATION_KEY = '[FORM] ADD_AUTHENTICATION_KEY';
export const ADD_PUBLIC_KEY = '[FORM] ADD_PUBLIC_KEY';
export const ADD_SERVICE = '[FORM] ADD_SERVICE';
export const ADD_ORIGINAL_AUTHENTICATION_KEYS = '[FORM] ADD_ORIGINAL_AUTHENTICATION_KEYS';
export const ADD_ORIGINAL_PUBLIC_KEYS = '[FORM] ADD_ORIGINAL_PUBLIC_KEYS';
export const ADD_ORIGINAL_SERVICES = '[FORM] ADD_ORIGINAL_SERVICES';
export const UPDATE_AUTHENTICATION_KEY = '[FORM] UPDATE_AUTHENTICATION_KEY';
export const UPDATE_PUBLIC_KEY = '[FORM] UPDATE_PUBLIC_KEY';
export const REMOVE_AUTHENTICATION_KEY = '[FORM] REMOVE_AUTHENTICATION_KEY';
export const REMOVE_PUBLIC_KEY = '[FORM] REMOVE_PUBLIC_KEY';
export const REMOVE_SERVICE = '[FORM] REMOVE_SERVICE';

export class AddAuthenticationKey implements Action {
  readonly type: string = ADD_AUTHENTICATION_KEY;

  constructor (public payload: KeyModel) { }
}

export class AddPublicKey implements Action {
  readonly type: string = ADD_PUBLIC_KEY;

  constructor (public payload: KeyModel) { }
}

export class AddService implements Action {
  readonly type: string = ADD_SERVICE;

  constructor (public payload: ServiceModel) { }
}

export class AddOriginalAuthenticationKeys implements Action {
  readonly type: string = ADD_ORIGINAL_AUTHENTICATION_KEYS;

  constructor (public payload: KeyModel[]) { }
}

export class AddOriginalPublicKeys implements Action {
  readonly type: string = ADD_ORIGINAL_PUBLIC_KEYS;

  constructor (public payload: KeyModel[]) { }
}

export class AddOriginalServices implements Action {
  readonly type: string = ADD_ORIGINAL_SERVICES;

  constructor (public payload: ServiceModel[]) { }
}

export class UpdateAuthenticationKey implements Action {
  readonly type: string = UPDATE_AUTHENTICATION_KEY;

  constructor (public payload: KeyModel) { }
}

export class UpdatePublicKey implements Action {
  readonly type: string = UPDATE_PUBLIC_KEY;

  constructor (public payload: KeyModel) { }
}

export class RemoveAuthenticationKey implements Action {
  readonly type: string = REMOVE_AUTHENTICATION_KEY;

  constructor (public payload: KeyModel) { }
}

export class RemovePublicKey implements Action {
  readonly type: string = REMOVE_PUBLIC_KEY;

  constructor (public payload: KeyModel) { }
}

export class RemoveService implements Action {
  readonly type: string = REMOVE_SERVICE;

  constructor (public payload: ServiceModel) { }
}
