import { Navigate } from 'react-router';
import { HOME_BY_ROLE, useMe } from '../../../features/auth';

export function HomeRedirect() {
  return <Navigate to={HOME_BY_ROLE[useMe().role]} replace />;
}
