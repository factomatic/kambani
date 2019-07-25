import { ActionType } from './action-type';
import { CreateRoutes } from './create-routes';
import { SharedRoutes } from './shared-routes';
import { UpdateRoutes } from './update-routes';

const actionRoutes = {
  [ActionType.CreateAdvanced]: [
    SharedRoutes.ManageDids,
    CreateRoutes.PublicKeys,
    CreateRoutes.AuthenticationKeys,
    CreateRoutes.Services,
    CreateRoutes.EncryptKeys,
    CreateRoutes.Summary,
    CreateRoutes.Final
  ],
  [ActionType.CreateBasic]: [
    SharedRoutes.ManageDids,
    CreateRoutes.EncryptKeys,
    CreateRoutes.Summary,
    CreateRoutes.Final
  ],
  [ActionType.Update]: [
    SharedRoutes.ManageDids,
    UpdateRoutes.Provide,
    UpdateRoutes.PublicKeys,
    UpdateRoutes.AuthenticationKeys,
    UpdateRoutes.Services,
    UpdateRoutes.EncryptKeys,
    UpdateRoutes.Summary,
    UpdateRoutes.Final
  ]
};

export {
  actionRoutes
};
