import { ActionType } from './action-type';
import { CreateRoutes } from './create-routes';
import { SharedRoutes } from './shared-routes';
import { UpdateRoutes } from './update-routes';

const actionRoutes = {
  [ActionType.CreateAdvanced]: [
    SharedRoutes.Action,
    CreateRoutes.ManagementKeys,
    CreateRoutes.DidKeys,
    CreateRoutes.Services,
    CreateRoutes.Summary,
    CreateRoutes.Final
  ],
  [ActionType.CreateBasic]: [
    SharedRoutes.Action,
    CreateRoutes.Summary,
    CreateRoutes.Final
  ],
  [ActionType.Update]: [
    SharedRoutes.Action,
    UpdateRoutes.ManagementKeys,
    UpdateRoutes.DidKeys,
    UpdateRoutes.Services,
    UpdateRoutes.Summary,
    UpdateRoutes.Final
  ]
};

export {
  actionRoutes
};
