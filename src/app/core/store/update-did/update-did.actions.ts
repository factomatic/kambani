import { Action } from "@ngrx/store";

import { DidKeyModel } from '../../models/did-key.model';
import { ManagementKeyModel } from '../../models/management-key.model';
import { ServiceModel } from '../../models/service.model';
import { UpdateDIDModel } from '../../models/update-did.model';

export enum UpdateDIDActionTypes {
  INITIALIZE_DID_UPDATE = '[Update DID] Initialize DID Update',
  ADD_MANAGEMENT_KEY = '[Update DID] Add Management Key',
  ADD_DID_KEY = '[Update DID] Add DID Key',
  ADD_SERVICE = '[Update DID] Add Service',
  UPDATE_MANAGEMENT_KEY = '[Update DID] Update Management Key',
  UPDATE_DID_KEY = '[Update DID] Update DID Key',
  REMOVE_MANAGEMENT_KEY = '[Update DID] Remove Management Key',
  REMOVE_DID_KEY = '[Update DID] Remove DID Key',
  REMOVE_SERVICE = '[Update DID] Remove Service',
  CANCEL_CHANGES = '[Update DID] Cancel Changes',
  COMPLETE_DID_UPDATE = '[Update DID] Complete DID Update'
}

export class InitializeDIDUpdate implements Action {
  readonly type: string = UpdateDIDActionTypes.INITIALIZE_DID_UPDATE;

  constructor (public payload: UpdateDIDModel) { }
}

export class AddManagementKey implements Action {
  readonly type: string = UpdateDIDActionTypes.ADD_MANAGEMENT_KEY;

  constructor (public didId: string, public payload: ManagementKeyModel) { }
}

export class AddDIDKey implements Action {
  readonly type: string = UpdateDIDActionTypes.ADD_DID_KEY;

  constructor (public didId: string, public payload: DidKeyModel) { }
}

export class AddService implements Action {
  readonly type: string = UpdateDIDActionTypes.ADD_SERVICE;

  constructor (public didId: string, public payload: ServiceModel) { }
}

export class UpdateManagementKey implements Action {
  readonly type: string = UpdateDIDActionTypes.UPDATE_MANAGEMENT_KEY;

  constructor (public didId: string, public payload: ManagementKeyModel) { }
}

export class UpdateDIDKey implements Action {
  readonly type: string = UpdateDIDActionTypes.UPDATE_DID_KEY;

  constructor (public didId: string, public payload: DidKeyModel) { }
}

export class RemoveManagementKey implements Action {
  readonly type: string = UpdateDIDActionTypes.REMOVE_MANAGEMENT_KEY;

  constructor (public didId: string, public payload: ManagementKeyModel) { }
}

export class RemoveDIDKey implements Action {
  readonly type: string = UpdateDIDActionTypes.REMOVE_DID_KEY;

  constructor (public didId: string, public payload: DidKeyModel) { }
}

export class RemoveService implements Action {
  readonly type: string = UpdateDIDActionTypes.REMOVE_SERVICE;

  constructor (public didId: string, public payload: ServiceModel) { }
}

export class CancelChanges implements Action {
  readonly type: string = UpdateDIDActionTypes.CANCEL_CHANGES;

  constructor (public didId: string) { }
}

export class CompleteDIDUpdate implements Action {
  readonly type: string = UpdateDIDActionTypes.COMPLETE_DID_UPDATE;

  constructor (public didId: string) { }
}