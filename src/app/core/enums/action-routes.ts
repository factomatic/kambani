import { ActionType } from './action-type';
import { CreateRoutes } from './create-routes';
import { SharedRoutes } from './shared-routes';
import { UpdateRoutes } from './update-routes';

const actionRoutes = {
  [ActionType.CreateAdvanced]: [
    SharedRoutes.ManageDids,
    CreateRoutes.ManagementKeys,
    CreateRoutes.DidKeys,
    CreateRoutes.Services,
    CreateRoutes.Summary,
    CreateRoutes.Final
  ],
  [ActionType.CreateBasic]: [
    SharedRoutes.ManageDids,
    CreateRoutes.Summary,
    CreateRoutes.Final
  ],
  [ActionType.Update]: [
    SharedRoutes.ManageDids,
    UpdateRoutes.Provide,
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
