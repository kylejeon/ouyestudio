
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const Home = lazy(() => import('../pages/home/page'));
const PhotoEditor = lazy(() => import('../pages/photo-editor/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/photo-editor',
    element: <PhotoEditor />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
