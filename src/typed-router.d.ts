/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

/// <reference types="unplugin-vue-router/client" />

import type {
  // type safe route locations
  RouteLocationTypedList,
  RouteLocationResolvedTypedList,
  RouteLocationNormalizedTypedList,
  RouteLocationNormalizedLoadedTypedList,
  RouteLocationAsString,
  RouteLocationAsRelativeTypedList,
  RouteLocationAsPathTypedList,

  // helper types
  // route definitions
  RouteRecordInfo,
  ParamValue,
  ParamValueOneOrMore,
  ParamValueZeroOrMore,
  ParamValueZeroOrOne,

  // vue-router extensions
  _RouterTyped,
  RouterLinkTyped,
  RouterLinkPropsTyped,
  NavigationGuard,
  UseLinkFnTyped,

  // data fetching
  _DataLoader,
  _DefineLoaderOptions,
} from 'unplugin-vue-router/types'

declare module 'vue-router/auto/routes' {
  export interface RouteNamedMap {
    '/[...all]': RouteRecordInfo<'/[...all]', '/:all(.*)', { all: ParamValue<true> }, { all: ParamValue<false> }>,
    '/app/home': RouteRecordInfo<'/app/home', '/app/home', Record<never, never>, Record<never, never>>,
    '/app/modules': RouteRecordInfo<'/app/modules', '/app/modules', Record<never, never>, Record<never, never>>,
    '/app/modules_test': RouteRecordInfo<'/app/modules_test', '/app/modules_test', Record<never, never>, Record<never, never>>,
    '/app/p/[p]/bundle/[bundle]': RouteRecordInfo<'/app/p/[p]/bundle/[bundle]', '/app/p/:p/bundle/:bundle', { p: ParamValue<true>, bundle: ParamValue<true> }, { p: ParamValue<false>, bundle: ParamValue<false> }>,
    '/app/p/[p]/bundles': RouteRecordInfo<'/app/p/[p]/bundles', '/app/p/:p/bundles', { p: ParamValue<true> }, { p: ParamValue<false> }>,
    '/app/p/[p]/channel/[channel]': RouteRecordInfo<'/app/p/[p]/channel/[channel]', '/app/p/:p/channel/:channel', { p: ParamValue<true>, channel: ParamValue<true> }, { p: ParamValue<false>, channel: ParamValue<false> }>,
    '/app/p/[p]/channels': RouteRecordInfo<'/app/p/[p]/channels', '/app/p/:p/channels', { p: ParamValue<true> }, { p: ParamValue<false> }>,
    '/app/p/[p]/d/[device]': RouteRecordInfo<'/app/p/[p]/d/[device]', '/app/p/:p/d/:device', { p: ParamValue<true>, device: ParamValue<true> }, { p: ParamValue<false>, device: ParamValue<false> }>,
    '/app/p/[p]/devices': RouteRecordInfo<'/app/p/[p]/devices', '/app/p/:p/devices', { p: ParamValue<true> }, { p: ParamValue<false> }>,
    '/app/p/[p]/logs': RouteRecordInfo<'/app/p/[p]/logs', '/app/p/:p/logs', { p: ParamValue<true> }, { p: ParamValue<false> }>,
    '/app/package/[package]': RouteRecordInfo<'/app/package/[package]', '/app/package/:package', { package: ParamValue<true> }, { package: ParamValue<false> }>,
    '/dashboard/ApiKeys': RouteRecordInfo<'/dashboard/ApiKeys', '/dashboard/ApiKeys', Record<never, never>, Record<never, never>>,
    '/dashboard/settings/Account': RouteRecordInfo<'/dashboard/settings/Account', '/dashboard/settings/Account', Record<never, never>, Record<never, never>>,
    '/dashboard/settings/Admin': RouteRecordInfo<'/dashboard/settings/Admin', '/dashboard/settings/Admin', Record<never, never>, Record<never, never>>,
    '/dashboard/settings/ChangePassword': RouteRecordInfo<'/dashboard/settings/ChangePassword', '/dashboard/settings/ChangePassword', Record<never, never>, Record<never, never>>,
    '/dashboard/settings/Notifications': RouteRecordInfo<'/dashboard/settings/Notifications', '/dashboard/settings/Notifications', Record<never, never>, Record<never, never>>,
    '/dashboard/settings/organization/General': RouteRecordInfo<'/dashboard/settings/organization/General', '/dashboard/settings/organization/General', Record<never, never>, Record<never, never>>,
    '/dashboard/settings/organization/Members': RouteRecordInfo<'/dashboard/settings/organization/Members', '/dashboard/settings/organization/Members', Record<never, never>, Record<never, never>>,
    '/dashboard/settings/Plans': RouteRecordInfo<'/dashboard/settings/Plans', '/dashboard/settings/Plans', Record<never, never>, Record<never, never>>,
    '/dashboard/settings/Usage': RouteRecordInfo<'/dashboard/settings/Usage', '/dashboard/settings/Usage', Record<never, never>, Record<never, never>>,
    '/delete_account': RouteRecordInfo<'/delete_account', '/delete_account', Record<never, never>, Record<never, never>>,
    '/forgot_password': RouteRecordInfo<'/forgot_password', '/forgot_password', Record<never, never>, Record<never, never>>,
    '/login': RouteRecordInfo<'/login', '/login', Record<never, never>, Record<never, never>>,
    '/onboarding/activation': RouteRecordInfo<'/onboarding/activation', '/onboarding/activation', Record<never, never>, Record<never, never>>,
    '/onboarding/confirm_email': RouteRecordInfo<'/onboarding/confirm_email', '/onboarding/confirm_email', Record<never, never>, Record<never, never>>,
    '/onboarding/set_password': RouteRecordInfo<'/onboarding/set_password', '/onboarding/set_password', Record<never, never>, Record<never, never>>,
    '/onboarding/verify_email': RouteRecordInfo<'/onboarding/verify_email', '/onboarding/verify_email', Record<never, never>, Record<never, never>>,
    '/register': RouteRecordInfo<'/register', '/register', Record<never, never>, Record<never, never>>,
    '/resend_email': RouteRecordInfo<'/resend_email', '/resend_email', Record<never, never>, Record<never, never>>,
  }
}

declare module 'vue-router/auto' {
  import type { RouteNamedMap } from 'vue-router/auto/routes'

  export type RouterTyped = _RouterTyped<RouteNamedMap>

  /**
   * Type safe version of `RouteLocationNormalized` (the type of `to` and `from` in navigation guards).
   * Allows passing the name of the route to be passed as a generic.
   */
  export type RouteLocationNormalized<Name extends keyof RouteNamedMap = keyof RouteNamedMap> = RouteLocationNormalizedTypedList<RouteNamedMap>[Name]

  /**
   * Type safe version of `RouteLocationNormalizedLoaded` (the return type of `useRoute()`).
   * Allows passing the name of the route to be passed as a generic.
   */
  export type RouteLocationNormalizedLoaded<Name extends keyof RouteNamedMap = keyof RouteNamedMap> = RouteLocationNormalizedLoadedTypedList<RouteNamedMap>[Name]

  /**
   * Type safe version of `RouteLocationResolved` (the returned route of `router.resolve()`).
   * Allows passing the name of the route to be passed as a generic.
   */
  export type RouteLocationResolved<Name extends keyof RouteNamedMap = keyof RouteNamedMap> = RouteLocationResolvedTypedList<RouteNamedMap>[Name]

  /**
   * Type safe version of `RouteLocation` . Allows passing the name of the route to be passed as a generic.
   */
  export type RouteLocation<Name extends keyof RouteNamedMap = keyof RouteNamedMap> = RouteLocationTypedList<RouteNamedMap>[Name]

  /**
   * Type safe version of `RouteLocationRaw` . Allows passing the name of the route to be passed as a generic.
   */
  export type RouteLocationRaw<Name extends keyof RouteNamedMap = keyof RouteNamedMap> =
    | RouteLocationAsString<RouteNamedMap>
    | RouteLocationAsRelativeTypedList<RouteNamedMap>[Name]
    | RouteLocationAsPathTypedList<RouteNamedMap>[Name]

  /**
   * Generate a type safe params for a route location. Requires the name of the route to be passed as a generic.
   */
  export type RouteParams<Name extends keyof RouteNamedMap> = RouteNamedMap[Name]['params']
  /**
   * Generate a type safe raw params for a route location. Requires the name of the route to be passed as a generic.
   */
  export type RouteParamsRaw<Name extends keyof RouteNamedMap> = RouteNamedMap[Name]['paramsRaw']

  export function useRouter(): RouterTyped
  export function useRoute<Name extends keyof RouteNamedMap = keyof RouteNamedMap>(name?: Name): RouteLocationNormalizedLoadedTypedList<RouteNamedMap>[Name]

  export const useLink: UseLinkFnTyped<RouteNamedMap>

  export function onBeforeRouteLeave(guard: NavigationGuard<RouteNamedMap>): void
  export function onBeforeRouteUpdate(guard: NavigationGuard<RouteNamedMap>): void

  export const RouterLink: RouterLinkTyped<RouteNamedMap>
  export const RouterLinkProps: RouterLinkPropsTyped<RouteNamedMap>

  // Experimental Data Fetching

  export function defineLoader<
    P extends Promise<any>,
    Name extends keyof RouteNamedMap = keyof RouteNamedMap,
    isLazy extends boolean = false,
  >(
    name: Name,
    loader: (route: RouteLocationNormalizedLoaded<Name>) => P,
    options?: _DefineLoaderOptions<isLazy>,
  ): _DataLoader<Awaited<P>, isLazy>
  export function defineLoader<
    P extends Promise<any>,
    isLazy extends boolean = false,
  >(
    loader: (route: RouteLocationNormalizedLoaded) => P,
    options?: _DefineLoaderOptions<isLazy>,
  ): _DataLoader<Awaited<P>, isLazy>

  export {
    _definePage as definePage,
    _HasDataLoaderMeta as HasDataLoaderMeta,
    _setupDataFetchingGuard as setupDataFetchingGuard,
    _stopDataFetchingScope as stopDataFetchingScope,
  } from 'unplugin-vue-router/runtime'
}

declare module 'vue-router' {
  import type { RouteNamedMap } from 'vue-router/auto/routes'

  export interface TypesConfig {
    beforeRouteUpdate: NavigationGuard<RouteNamedMap>
    beforeRouteLeave: NavigationGuard<RouteNamedMap>

    $route: RouteLocationNormalizedLoadedTypedList<RouteNamedMap>[keyof RouteNamedMap]
    $router: _RouterTyped<RouteNamedMap>

    RouterLink: RouterLinkTyped<RouteNamedMap>
  }
}
