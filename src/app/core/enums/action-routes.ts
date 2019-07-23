import { ActionType } from './action-type';
import { CreateRoutes } from './create-routes';
import { SharedRoutes } from './shared-routes';
import { UpdateRoutes } from './update-routes';

const actionRoutes = {
  [ActionType.CreateAdvanced]: [
    SharedRoutes.Action,
    CreateRoutes.PublicKeys,
    CreateRoutes.AuthenticationKeys,
    CreateRoutes.Services,
    CreateRoutes.EncryptKeys,
    CreateRoutes.Summary,
    SharedRoutes.Final
  ],
  [ActionType.CreateBasic]: [
    SharedRoutes.Action,
    CreateRoutes.EncryptKeys,
    CreateRoutes.Summary,
    SharedRoutes.Final
  ],
  [ActionType.Update]: [
    SharedRoutes.Action,
    UpdateRoutes.Provide,
    UpdateRoutes.PublicKeys,
    UpdateRoutes.AuthenticationKeys,
    UpdateRoutes.Services,
    UpdateRoutes.EncryptKeys,
    UpdateRoutes.Summary,
    SharedRoutes.Final
  ]
};

export {
  actionRoutes
};
