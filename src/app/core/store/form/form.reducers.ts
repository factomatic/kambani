import { ADD_MANAGEMENT_KEY, ADD_DID_KEY, ADD_SERVICE,
  ADD_ORIGINAL_MANAGEMENT_KEYS, ADD_ORIGINAL_DID_KEYS, ADD_ORIGINAL_SERVICES,
  UPDATE_MANAGEMENT_KEY, UPDATE_DID_KEY,
  REMOVE_MANAGEMENT_KEY, REMOVE_DID_KEY, REMOVE_SERVICE } from './form.actions';
import { CLEAR_FORM } from '../action/action.actions';
import { DidKeyModel } from '../../models/did-key.model';
import { FormState } from './form.state';
import { ManagementKeyModel } from '../../models/management-key.model';
import { ServiceModel } from '../../models/service.model';

const initialState: FormState = {
  managementKeys: [],
  didKeys: [],
  services: [],
  originalManagementKeys: [],
  originalDidKeys: [],
  originalServices: []
};

function addManagementKey(state: FormState, managementKey: ManagementKeyModel) {
  return {
    ...state,
    managementKeys: [...state.managementKeys, managementKey]
  };
}

function addDidKey(state: FormState, didKey: DidKeyModel) {
  return {
    ...state,
    didKeys: [...state.didKeys, didKey]
  };
}

function addService(state: FormState, service: ServiceModel) {
  return {
    ...state,
    services: [...state.services, service]
  };
}

function addOriginalManagementKeys(state: FormState, managementKeys: ManagementKeyModel[]) {
  return {
    ...state,
    managementKeys: managementKeys,
    originalManagementKeys: managementKeys
  };
}

function addOriginalDidKey(state: FormState, didKeys: DidKeyModel[]) {
  return {
    ...state,
    didKeys: didKeys,
    originalDidKeys: didKeys
  };
}

function addOriginalService(state: FormState, services: ServiceModel[]) {
  return {
    ...state,
    services: services,
    originalServices: services
  };
}

function updateManagementKey(state: FormState, key: ManagementKeyModel) {
  const managementKeys = state.managementKeys.slice();
  const managementKeyIndex = managementKeys.findIndex(k => k.publicKey === key.publicKey);
  managementKeys[managementKeyIndex] = key;

  return {
    ...state,
    managementKeys: managementKeys
  };
}

function updateDidKey(state: FormState, key: DidKeyModel) {
  const didKeys = state.didKeys.slice();
  const didKeyIndex = didKeys.findIndex(k => k.publicKey === key.publicKey);
  didKeys[didKeyIndex] = key;

  return {
    ...state,
    didKeys: didKeys
  };
}

function removeManagementKey(state: FormState, key: ManagementKeyModel) {
  return {
    ...state,
    managementKeys: state.managementKeys.filter(k => k.publicKey !== key.publicKey)
  };
}

function removeDidKey(state: FormState, key: DidKeyModel) {
  return {
    ...state,
    didKeys: state.didKeys.filter(k => k.publicKey !== key.publicKey)
  };
}

function removeService(state: FormState, service: ServiceModel) {
  return {
    ...state,
    services: state.services.filter(s => s !== service),
  };
}

export function formReducers(state: FormState = initialState, action) {
  switch (action.type) {
    case ADD_MANAGEMENT_KEY:
      return addManagementKey(state, action.payload);
    case ADD_DID_KEY:
      return addDidKey(state, action.payload);
    case ADD_SERVICE:
      return addService(state, action.payload);
    case ADD_ORIGINAL_MANAGEMENT_KEYS:
      return addOriginalManagementKeys(state, action.payload);
    case ADD_ORIGINAL_DID_KEYS:
      return addOriginalDidKey(state, action.payload);
    case ADD_ORIGINAL_SERVICES:
      return addOriginalService(state, action.payload);
    case UPDATE_MANAGEMENT_KEY:
      return updateManagementKey(state, action.payload);
    case UPDATE_DID_KEY:
      return updateDidKey(state, action.payload);
    case CLEAR_FORM:
      return initialState;
    case REMOVE_MANAGEMENT_KEY:
      return removeManagementKey(state, action.payload);
    case REMOVE_DID_KEY:
      return removeDidKey(state, action.payload);
    case REMOVE_SERVICE:
      return removeService(state, action.payload);
    default:
      return state;
  }
}
