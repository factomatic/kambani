import { ADD_AUTHENTICATION_KEY, ADD_PUBLIC_KEY, ADD_SERVICE,
  ADD_ORIGINAL_AUTHENTICATION_KEYS, ADD_ORIGINAL_PUBLIC_KEYS, ADD_ORIGINAL_SERVICES,
  UPDATE_AUTHENTICATION_KEY, UPDATE_PUBLIC_KEY,
  REMOVE_AUTHENTICATION_KEY, REMOVE_PUBLIC_KEY, REMOVE_SERVICE } from './form.actions';
import { CLEAR_FORM } from '../action/action.actions';
import { FormState } from './form.state';
import { KeyModel } from '../../models/key.model';
import { ServiceModel } from '../../models/service.model';

const initialState: FormState = {
  authenticationKeys: [],
  publicKeys: [],
  services: [],
  originalAuthenticationKeys: [],
  originalPublicKeys: [],
  originalServices: []
};

function addAuthenticationKey(state: FormState, authenticationKey: KeyModel) {
  return {
    ...state,
    authenticationKeys: [...state.authenticationKeys, authenticationKey]
  };
}

function addPublicKey(state: FormState, publicKey: KeyModel) {
  return {
    ...state,
    publicKeys: [...state.publicKeys, publicKey]
  };
}

function addService(state: FormState, service: ServiceModel) {
  return {
    ...state,
    services: [...state.services, service]
  };
}

function addOriginalAuthenticationKeys(state: FormState, authenticationKeys: KeyModel[]) {
  return {
    ...state,
    authenticationKeys: authenticationKeys,
    originalAuthenticationKeys: authenticationKeys
  };
}

function addOriginalPublicKey(state: FormState, publicKeys: KeyModel[]) {
  return {
    ...state,
    publicKeys: publicKeys,
    originalPublicKeys: publicKeys
  };
}

function addOriginalService(state: FormState, services: ServiceModel[]) {
  return {
    ...state,
    services: services,
    originalServices: services
  };
}

function updateAuthenticationKey(state: FormState, key: KeyModel) {
  const authenticationKeys = state.authenticationKeys.slice();
  const authKeyIndex = authenticationKeys.findIndex(k => k.publicKey === key.publicKey);
  authenticationKeys[authKeyIndex] = key;

  const publicKeys = state.publicKeys.slice();
  const pubKeyIndex = publicKeys.findIndex(k => k.publicKey === key.publicKey);
  if (pubKeyIndex > -1) {
    publicKeys[pubKeyIndex] = key;
  }

  return {
    ...state,
    publicKeys: publicKeys,
    authenticationKeys: authenticationKeys
  };
}

function updatePublicKey(state: FormState, key: KeyModel) {
  const publicKeys = state.publicKeys.slice();
  const pubKeyIndex = publicKeys.findIndex(k => k.publicKey === key.publicKey);
  publicKeys[pubKeyIndex] = key;

  const authenticationKeys = state.authenticationKeys.slice();
  const authKeyIndex = authenticationKeys.findIndex(k => k.publicKey === key.publicKey);
  if (authKeyIndex > -1) {
    authenticationKeys[authKeyIndex] = key;
  }

  return {
    ...state,
    publicKeys: publicKeys,
    authenticationKeys: authenticationKeys
  };
}

function removeAuthenticationKey(state: FormState, key: KeyModel) {
  return {
    ...state,
    authenticationKeys: state.authenticationKeys.filter(k => k.publicKey !== key.publicKey),
  };
}

function removePublicKey(state: FormState, key: KeyModel) {
  return {
    ...state,
    authenticationKeys: state.authenticationKeys.filter(k => k.publicKey !== key.publicKey),
    publicKeys: state.publicKeys.filter(k => k.publicKey !== key.publicKey)
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
    case ADD_AUTHENTICATION_KEY:
      return addAuthenticationKey(state, action.payload);
    case ADD_PUBLIC_KEY:
      return addPublicKey(state, action.payload);
    case ADD_SERVICE:
      return addService(state, action.payload);
    case ADD_ORIGINAL_AUTHENTICATION_KEYS:
      return addOriginalAuthenticationKeys(state, action.payload);
    case ADD_ORIGINAL_PUBLIC_KEYS:
      return addOriginalPublicKey(state, action.payload);
    case ADD_ORIGINAL_SERVICES:
      return addOriginalService(state, action.payload);
    case UPDATE_AUTHENTICATION_KEY:
      return updateAuthenticationKey(state, action.payload);
    case UPDATE_PUBLIC_KEY:
      return updatePublicKey(state, action.payload);
    case CLEAR_FORM:
      return initialState;
    case REMOVE_AUTHENTICATION_KEY:
      return removeAuthenticationKey(state, action.payload);
    case REMOVE_PUBLIC_KEY:
      return removePublicKey(state, action.payload);
    case REMOVE_SERVICE:
      return removeService(state, action.payload);
    default:
      return state;
  }
}
