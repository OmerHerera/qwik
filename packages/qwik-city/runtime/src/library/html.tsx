import {
  component$,
  noSerialize,
  Slot,
  useContextProvider,
  useStore,
  useWatch$,
} from '@builder.io/qwik';
import { loadRoute } from './routing';
import type {
  ContentModule,
  ContentState,
  ContentStateInternal,
  MutableRouteLocation,
  PageModule,
  RouteNavigate,
} from './types';
import {
  ContentContext,
  ContentInternalContext,
  DocumentHeadContext,
  RouteLocationContext,
  RouteNavigateContext,
} from './contexts';
import { createDocumentHead, resolveHead } from './head';
import { isBrowser } from '@builder.io/qwik/build';
import { useQwikCityEnv } from './use-functions';
import { clientNavigate, toPath } from './client-navigation';

/**
 * @alpha
 */
export const QwikCity = component$(() => {
  const env = useQwikCityEnv();

  const routeLocation = useStore<MutableRouteLocation>(() => {
    const initRouteLocation = env?.route;
    if (!initRouteLocation) {
      throw new Error(`Missing Qwik City User Context`);
    }
    return initRouteLocation;
  });

  const routeNavigate = useStore<RouteNavigate>(() => {
    const initRouteLocation = env?.route;
    return {
      path: toPath(new URL(initRouteLocation!.href)),
    };
  });

  const documentHead = useStore(createDocumentHead);
  const content = useStore<ContentState>({
    headings: undefined,
    menu: undefined,
  });

  const contentInternal = useStore<ContentStateInternal>({
    contents: undefined,
  });

  useContextProvider(ContentContext, content);
  useContextProvider(ContentInternalContext, contentInternal);
  useContextProvider(DocumentHeadContext, documentHead);
  useContextProvider(RouteLocationContext, routeLocation);
  useContextProvider(RouteNavigateContext, routeNavigate);

  useWatch$(async ({ track }) => {
    const { default: cityPlan } = await import('@qwik-city-plan');
    const path = track(routeNavigate, 'path');
    const url = new URL(path, routeLocation.href);
    const loadedRoute = await loadRoute(
      cityPlan.routes,
      cityPlan.menus,
      cityPlan.cacheModules,
      url.pathname
    );
    if (loadedRoute) {
      const contentModules = loadedRoute.mods as ContentModule[];
      const pageModule = contentModules[contentModules.length - 1] as PageModule;
      const resolvedHead = resolveHead(env?.response, routeLocation, contentModules);

      // Update document head
      documentHead.links = resolvedHead.links;
      documentHead.meta = resolvedHead.meta;
      documentHead.styles = resolvedHead.styles;
      documentHead.title = resolvedHead.title;

      // Update content
      content.headings = pageModule.headings;
      content.menu = loadedRoute.menu;
      contentInternal.contents = noSerialize(contentModules);

      // Update route location
      routeLocation.href = url.href;
      routeLocation.pathname = url.pathname;
      routeLocation.params = { ...loadedRoute.params };
      routeLocation.query = Object.fromEntries(url.searchParams.entries());

      if (isBrowser) {
        clientNavigate(window, routeNavigate);
      }
    }
  });

  return <Slot />;
});

/**
 * @alpha
 * @deprecated - use QwikCity
 */
export const Html = QwikCity;
