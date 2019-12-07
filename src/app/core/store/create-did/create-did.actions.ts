import { Action } from '@ngrx/store';

import { DidKeyModel } from '../../models/did-key.model';
import { ManagementKeyModel } from '../../models/management-key.model';
import { ServiceModel } from '../../models/service.model';

export enum CreateDIDActionTypes {
  ADD_MANAGEMENT_KEY = '[Create DID] Add Management Key',
  ADD_DID_KEY = '[Create DID] Add DID Key',
  ADD_SERVICE = '[Create DID] Add Service',
  UPDATE_MANAGEMENT_KEY = '[Create DID] Update Management Key',
  UPDATE_DID_KEY = '[Create DID] Update DID Key',
  REMOVE_MANAGEMENT_KEY = '[Create DID] Remove Management Key',
  REMOVE_DID_KEY = '[Create DID] Remove DID Key',
  REMOVE_SERVICE = '[Create DID] Remove Service',
  CLEAR_CREATE_DID_STATE = '[Create DID] Clear Create DID State'
}

export class AddManagementKey implements Action {
  readonly type: string = CreateDIDActionTypes.ADD_MANAGEMENT_KEY;

  constructor (public payload: ManagementKeyModel) { }
}

export class AddDIDKey implements Action {
  readonly type: string = CreateDIDActionTypes.ADD_DID_KEY;

  constructor (public payload: DidKeyModel) { }
}

export class AddService implements Action {
  readonly type: string = CreateDIDActionTypes.ADD_SERVICE;

  constructor (public payload: ServiceModel) { }
}

export class UpdateManagementKey implements Action {
  readonly type: string = CreateDIDActionTypes.UPDATE_MANAGEMENT_KEY;

  constructor (public payload: ManagementKeyModel) { }
}

export class UpdateDIDKey implements Action {
  readonly type: string = CreateDIDActionTypes.UPDATE_DID_KEY;

  constructor (public payload: DidKeyModel) { }
}

export class RemoveManagementKey implements Action {
  readonly type: string = CreateDIDActionTypes.REMOVE_MANAGEMENT_KEY;

  constructor (public payload: ManagementKeyModel) { }
}

export class RemoveDIDKey implements Action {
  readonly type: string = CreateDIDActionTypes.REMOVE_DID_KEY;

  constructor (public payload: DidKeyModel) { }
}

export class RemoveService implements Action {
  readonly type: string = CreateDIDActionTypes.REMOVE_SERVICE;

  constructor (public payload: ServiceModel) { }
}

export class ClearCreateDIDState implements Action {
  readonly type: string = CreateDIDActionTypes.CLEAR_CREATE_DID_STATE;
}