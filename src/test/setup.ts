// jsdom lacks a few browser APIs the screens use.
class NoopObserver { observe() {} unobserve() {} disconnect() {} }
Object.assign(globalThis, { ResizeObserver: NoopObserver, IntersectionObserver: NoopObserver });
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: query.includes('min-width'), media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
  }) as MediaQueryList;
}
Element.prototype.scrollIntoView ??= function scrollIntoView() {};
Element.prototype.scrollTo ??= function scrollTo() {};
