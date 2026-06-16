const scriptPromises = new Map<string, Promise<void>>();

export function loadScript(src: string) {
  const existingPromise = scriptPromises.get(src);

  if (existingPromise) {
    return existingPromise;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

    if (existingScript?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existingScript ?? document.createElement("script");

    script.async = true;
    script.defer = true;
    script.src = src;

    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => {
        scriptPromises.delete(src);
        reject(new Error(`Could not load external script: ${src}`));
      },
      { once: true },
    );

    if (!existingScript) {
      document.head.append(script);
    }
  });

  scriptPromises.set(src, promise);
  return promise;
}
