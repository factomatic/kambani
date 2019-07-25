import { Action } from '@ngrx/store';
import { DidKeyModel } from '../../models/did-key.model';
import { ManagementKeyModel } from '../../models/management-key.model';
import { ServiceModel } from '../../models/service.model';

export const ADD_MANAGEMENT_KEY = '[FORM] ADD_MANAGEMENT_KEY';
export const ADD_DID_KEY = '[FORM] ADD_DID_KEY';
export const ADD_SERVICE = '[FORM] ADD_SERVICE';
export const ADD_ORIGINAL_MANAGEMENT_KEYS = '[FORM] ADD_ORIGINAL_MANAGEMENT_KEYS';
export const ADD_ORIGINAL_DID_KEYS = '[FORM] ADD_ORIGINAL_DID_KEYS';
export const ADD_ORIGINAL_SERVICES = '[FORM] ADD_ORIGINAL_SERVICES';
export const UPDATE_MANAGEMENT_KEY = '[FORM] UPDATE_MANAGEMENT_KEY';
export const UPDATE_DID_KEY = '[FORM] UPDATE_DID_KEY';
export const REMOVE_MANAGEMENT_KEY = '[FORM] REMOVE_MANAGEMENT_KEY';
export const REMOVE_DID_KEY = '[FORM] REMOVE_DID_KEY';
export const REMOVE_SERVICE = '[FORM] REMOVE_SERVICE';

export class AddManagementKey implements Action {
  readonly type: string = ADD_MANAGEMENT_KEY;

  constructor (public payload: ManagementKeyModel) { }
}

export class AddDidKey implements Action {
  readonly type: string = ADD_DID_KEY;

  constructor (public payload: DidKeyModel) { }
}

export class AddService implements Action {
  readonly type: string = ADD_SERVICE;

  constructor (public payload: ServiceModel) { }
}

export class AddOriginalManagementKeys implements Action {
  readonly type: string = ADD_ORIGINAL_MANAGEMENT_KEYS;

  constructor (public payload: ManagementKeyModel[]) { }
}

export class AddOriginalDidKeys implements Action {
  readonly type: string = ADD_ORIGINAL_DID_KEYS;

  constructor (public payload: DidKeyModel[]) { }
}

export class AddOriginalServices implements Action {
  readonly type: string = ADD_ORIGINAL_SERVICES;

  constructor (public payload: ServiceModel[]) { }
}

export class UpdateManagementKey implements Action {
  readonly type: string = UPDATE_MANAGEMENT_KEY;

  constructor (public payload: ManagementKeyModel) { }
}

export class UpdateDidKey implements Action {
  readonly type: string = UPDATE_DID_KEY;

  constructor (public payload: DidKeyModel) { }
}

export class RemoveManagementKey implements Action {
  readonly type: string = REMOVE_MANAGEMENT_KEY;

  constructor (public payload: ManagementKeyModel) { }
}

export class RemoveDidKey implements Action {
  readonly type: string = REMOVE_DID_KEY;

  constructor (public payload: DidKeyModel) { }
}

export class RemoveService implements Action {
  readonly type: string = REMOVE_SERVICE;

  constructor (public payload: ServiceModel) { }
}
