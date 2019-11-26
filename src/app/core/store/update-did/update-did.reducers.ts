import { DidKeyModel } from '../../models/did-key.model';
import { ManagementKeyModel } from '../../models/management-key.model';
import { ServiceModel } from '../../models/service.model';
import { UpdateDIDActionTypes } from './update-did.actions';
import { UpdateDIDState } from './update-did.state';
import { UpdateDIDModel } from '../../models/update-did.model';

const initialState: UpdateDIDState = {
  dids: []
};

function initializeDIDUpdate(state: UpdateDIDState, did: UpdateDIDModel) {
  return Object.assign({}, state, {
    dids: [...state.dids, did]
  });
}

function addManagementKey(state: UpdateDIDState, didId: string, managementKey: ManagementKeyModel) {
  const didsCopy = state.dids.slice();
  const did = didsCopy.find(d => d.didId === didId);
  if (did) {
    did.managementKeys = [...did.managementKeys, managementKey];
  }

  return Object.assign({}, state, {
    dids: didsCopy
  });
}

function addDIDKey(state: UpdateDIDState, didId: string, didKey: DidKeyModel) {
  const didsCopy = state.dids.slice();
  const did = didsCopy.find(d => d.didId === didId);
  if (did) {
    did.didKeys = [...did.didKeys, didKey];
  }

  return Object.assign({}, state, {
    dids: didsCopy
  });
}

function addService(state: UpdateDIDState, didId: string, service: ServiceModel) {
  const didsCopy = state.dids.slice();
  const did = didsCopy.find(d => d.didId === didId);
  if (did) {
    did.services = [...did.services, service];
  }

  return Object.assign({}, state, {
    dids: didsCopy
  });
}

function updateManagementKey(state: UpdateDIDState, didId: string, key: ManagementKeyModel) {
  const didsCopy = state.dids.slice();
  const did = didsCopy.find(d => d.didId === didId);
  if (did) {
    const managementKeyIndex = did.managementKeys.findIndex(mk => mk.publicKey === key.publicKey);
    const managementKeysCopy = did.managementKeys.slice();
    managementKeysCopy[managementKeyIndex] = key;
    did.managementKeys = managementKeysCopy;
  }

  return Object.assign({}, state, {
    dids: didsCopy
  });
}

function updateDidKey(state: UpdateDIDState, didId: string, key: DidKeyModel) {
  const didsCopy = state.dids.slice();
  const did = didsCopy.find(d => d.didId === didId);
  if (did) {
    const didKeyIndex = did.didKeys.findIndex(dk => dk.publicKey === key.publicKey);
    const didKeysCopy = did.didKeys.slice();
    didKeysCopy[didKeyIndex] = key;
    did.didKeys = didKeysCopy;
  }

  return Object.assign({}, state, {
    dids: didsCopy
  });
}

function removeManagementKey(state: UpdateDIDState, didId: string, key: ManagementKeyModel) {
  const didsCopy = state.dids.slice();
  const did = didsCopy.find(d => d.didId === didId);
  if (did) {
    did.managementKeys = did.managementKeys.filter(mk => mk.publicKey !== key.publicKey);
  }

  return Object.assign({}, state, {
    dids: didsCopy
  });
}

function removeDidKey(state: UpdateDIDState, didId: string, key: DidKeyModel) {
  const didsCopy = state.dids.slice();
  const did = didsCopy.find(d => d.didId === didId);
  if (did) {
    did.didKeys = did.didKeys.filter(dk => dk.publicKey !== key.publicKey);
  }

  return Object.assign({}, state, {
    dids: didsCopy
  });
}

function removeService(state: UpdateDIDState, didId: string, service: ServiceModel) {
  const didsCopy = state.dids.slice();
  const did = didsCopy.find(d => d.didId === didId);
  if (did) {
    did.services = did.services.filter(s => s !== service);
  }

  return Object.assign({}, state, {
    dids: didsCopy
  });
}

export function updateDIDReducers(state: UpdateDIDState = initialState, action): UpdateDIDState {
  switch (action.type) {
    case UpdateDIDActionTypes.INITIALIZE_DID_UPDATE:
      return initializeDIDUpdate(state, action.payload);
    case UpdateDIDActionTypes.ADD_MANAGEMENT_KEY:
      return addManagementKey(state, action.didId, action.payload);
    case UpdateDIDActionTypes.ADD_DID_KEY:
      return addDIDKey(state, action.didId, action.payload);
    case UpdateDIDActionTypes.ADD_SERVICE:
      return addService(state, action.didId, action.payload);
    case UpdateDIDActionTypes.UPDATE_MANAGEMENT_KEY:
      return updateManagementKey(state, action.didId, action.payload);
    case UpdateDIDActionTypes.UPDATE_DID_KEY:
      return updateDidKey(state, action.didId, action.payload);
    case UpdateDIDActionTypes.REMOVE_MANAGEMENT_KEY:
      return removeManagementKey(state, action.didId, action.payload);
    case UpdateDIDActionTypes.REMOVE_DID_KEY:
      return removeDidKey(state, action.didId, action.payload);
    case UpdateDIDActionTypes.REMOVE_SERVICE:
      return removeService(state, action.didId, action.payload);
    default:
      return state;
  }
}