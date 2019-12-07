import { CreateDIDActionTypes } from './create-did.actions';
import { CreateDIDState } from './create-did.state';
import { DidKeyModel } from '../../models/did-key.model';
import { ManagementKeyModel } from '../../models/management-key.model';
import { ServiceModel } from '../../models/service.model';

const initialState: CreateDIDState = {
  managementKeys: [],
  didKeys: [],
  services: []
};

function addManagementKey(state: CreateDIDState, managementKey: ManagementKeyModel) {
  return Object.assign({}, state, {
    managementKeys: [...state.managementKeys, managementKey]
  });
}

function addDIDKey(state: CreateDIDState, didKey: DidKeyModel) {
  return Object.assign({}, state, {
    didKeys: [...state.didKeys, didKey]
  });
}

function addService(state: CreateDIDState, service: ServiceModel) {
  return Object.assign({}, state, {
    services: [...state.services, service]
  });
}

function updateManagementKey(state: CreateDIDState, key: ManagementKeyModel) {
  const managementKeys = state.managementKeys.slice();
  const managementKeyIndex = managementKeys.findIndex(k => k.publicKey === key.publicKey);
  managementKeys[managementKeyIndex] = key;

  return Object.assign({}, state, {
    managementKeys: managementKeys
  });
}

function updateDidKey(state: CreateDIDState, key: DidKeyModel) {
  const didKeys = state.didKeys.slice();
  const didKeyIndex = didKeys.findIndex(k => k.publicKey === key.publicKey);
  didKeys[didKeyIndex] = key;

  return Object.assign({}, state, {
    didKeys: didKeys
  });
}

function removeManagementKey(state: CreateDIDState, key: ManagementKeyModel) {
  return Object.assign({}, state, {
    managementKeys: state.managementKeys.filter(k => k.publicKey !== key.publicKey)
  });
}

function removeDIDKey(state: CreateDIDState, key: DidKeyModel) {
  return Object.assign({}, state, {
    didKeys: state.didKeys.filter(k => k.publicKey !== key.publicKey)
  });
}

function removeService(state: CreateDIDState, service: ServiceModel) {
  return Object.assign({}, state, {
    services: state.services.filter(s => s !== service)
  });
}

export function createDIDReducers(state: CreateDIDState = initialState, action) {
  switch (action.type) {
    case CreateDIDActionTypes.ADD_MANAGEMENT_KEY:
      return addManagementKey(state, action.payload);
    case CreateDIDActionTypes.ADD_DID_KEY:
      return addDIDKey(state, action.payload);
    case CreateDIDActionTypes.ADD_SERVICE:
      return addService(state, action.payload);
    case CreateDIDActionTypes.UPDATE_MANAGEMENT_KEY:
      return updateManagementKey(state, action.payload);
    case CreateDIDActionTypes.UPDATE_DID_KEY:
      return updateDidKey(state, action.payload);
    case CreateDIDActionTypes.REMOVE_MANAGEMENT_KEY:
      return removeManagementKey(state, action.payload);
    case CreateDIDActionTypes.REMOVE_DID_KEY:
      return removeDIDKey(state, action.payload);
    case CreateDIDActionTypes.REMOVE_SERVICE:
      return removeService(state, action.payload);
    case CreateDIDActionTypes.CLEAR_CREATE_DID_STATE:
      return initialState;
    default:
      return state;
  }
}