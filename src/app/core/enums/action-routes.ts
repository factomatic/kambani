import { ActionType } from './action-type';
import { CreateRoutes } from './create-routes';
import { SharedRoutes } from './shared-routes';

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
  ]
};

export {
  actionRoutes
};
