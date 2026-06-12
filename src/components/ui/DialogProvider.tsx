import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button } from "./Button";
import { Input } from "./Input";

type DialogChoice<T extends string = string> = {
  value: T;
  label: string;
  description: string;
};

type BaseDialogRequest = {
  title: string;
  message?: string;
};

type DialogRequest =
  | (BaseDialogRequest & {
      kind: "alert";
      resolve: () => void;
    })
  | (BaseDialogRequest & {
      kind: "confirm";
      confirmLabel?: string;
      danger?: boolean;
      resolve: (value: boolean) => void;
    })
  | (BaseDialogRequest & {
      kind: "prompt";
      defaultValue?: string;
      confirmLabel?: string;
      resolve: (value: string | null) => void;
    })
  | (BaseDialogRequest & {
      kind: "choice";
      choices: DialogChoice[];
      confirmLabel?: string;
      resolve: (value: string | null) => void;
    });

type DialogContextValue = {
  alert: (request: BaseDialogRequest) => Promise<void>;
  confirm: (request: BaseDialogRequest & { confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
  prompt: (request: BaseDialogRequest & { defaultValue?: string; confirmLabel?: string }) => Promise<string | null>;
  choose: <T extends string>(
    request: BaseDialogRequest & { choices: DialogChoice<T>[]; confirmLabel?: string },
  ) => Promise<T | null>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

type DialogProviderProps = {
  children: ReactNode;
};

export function DialogProvider({ children }: DialogProviderProps) {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  const alert = useCallback<DialogContextValue["alert"]>(
    (dialogRequest) =>
      new Promise((resolve) => {
        setRequest({
          ...dialogRequest,
          kind: "alert",
          resolve,
        });
      }),
    [],
  );

  const confirm = useCallback<DialogContextValue["confirm"]>(
    (dialogRequest) =>
      new Promise((resolve) => {
        setRequest({
          ...dialogRequest,
          kind: "confirm",
          resolve,
        });
      }),
    [],
  );

  const prompt = useCallback<DialogContextValue["prompt"]>(
    (dialogRequest) =>
      new Promise((resolve) => {
        setRequest({
          ...dialogRequest,
          kind: "prompt",
          resolve,
        });
      }),
    [],
  );

  const choose = useCallback<DialogContextValue["choose"]>(
    (dialogRequest) =>
      new Promise((resolve) => {
        setRequest({
          ...dialogRequest,
          kind: "choice",
          resolve: (value) => resolve(value as never),
        });
      }),
    [],
  );

  const value = useMemo(
    () => ({
      alert,
      confirm,
      prompt,
      choose,
    }),
    [alert, choose, confirm, prompt],
  );

  function closeDialog() {
    setRequest(null);
  }

  return (
    <DialogContext.Provider value={value}>
      {children}
      {request ? <CenteredDialog request={request} onClose={closeDialog} /> : null}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("useDialog must be used inside DialogProvider.");
  }

  return context;
}

function CenteredDialog({ request, onClose }: { request: DialogRequest; onClose: () => void }) {
  const initialPromptValue = request.kind === "prompt" ? request.defaultValue ?? "" : "";
  const initialChoiceValue = request.kind === "choice" ? request.choices[0]?.value ?? "" : "";
  const [promptValue, setPromptValue] = useState(initialPromptValue);
  const [choiceValue, setChoiceValue] = useState(initialChoiceValue);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  function cancel() {
    if (request.kind === "alert") {
      request.resolve();
    } else if (request.kind === "confirm") {
      request.resolve(false);
    } else {
      request.resolve(null);
    }

    onClose();
  }

  function confirm(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (request.kind === "alert") {
      request.resolve();
    } else if (request.kind === "confirm") {
      request.resolve(true);
    } else if (request.kind === "prompt") {
      request.resolve(promptValue);
    } else {
      request.resolve(choiceValue);
    }

    onClose();
  }

  return (
    <div className="dialog-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && cancel()}>
      <form className="dialog-panel" aria-labelledby={titleId} aria-modal="true" role="dialog" onSubmit={confirm}>
        <div ref={dialogRef} className="dialog-panel__focus-target" tabIndex={-1}>
          <h2 id={titleId}>{request.title}</h2>
          {request.message ? <p>{request.message}</p> : null}

          {request.kind === "prompt" ? (
            <Input
              autoFocus
              className="dialog-panel__input"
              value={promptValue}
              onChange={(event) => setPromptValue(event.target.value)}
            />
          ) : null}

          {request.kind === "choice" ? (
            <div className="dialog-choice-list">
              {request.choices.map((choice) => (
                <label key={choice.value} className="dialog-choice">
                  <input
                    type="radio"
                    name="dialog-choice"
                    value={choice.value}
                    checked={choiceValue === choice.value}
                    onChange={() => setChoiceValue(choice.value)}
                  />
                  <span>
                    <strong>{choice.label}</strong>
                    <small>{choice.description}</small>
                  </span>
                </label>
              ))}
            </div>
          ) : null}

          <div className="dialog-panel__actions">
            {request.kind === "alert" ? null : (
              <Button variant="secondary" onClick={cancel}>
                Cancel
              </Button>
            )}
            <Button
              variant={request.kind === "confirm" && request.danger ? "danger" : "primary"}
              type="submit"
              disabled={request.kind === "choice" && !choiceValue}
            >
              {request.kind === "alert" ? "OK" : request.confirmLabel ?? "Continue"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
