import { useEffect, useRef } from "react";
import { consumeGoogleDriveRedirectResult } from "../../lib/googleDrive/auth";
import { useDialog } from "../ui/DialogProvider";
import { useDrivePublishActions } from "./useDrivePublishActions";
import { useDriveSaveActions } from "./useDriveSaveActions";

export function DriveAuthRedirectHandler() {
  const handledRef = useRef(false);
  const dialog = useDialog();
  const { resumeDrivePublishFromRedirect } = useDrivePublishActions();
  const { resumeDriveSaveFromRedirect } = useDriveSaveActions();

  useEffect(() => {
    if (handledRef.current) {
      return;
    }

    const redirectResult = consumeGoogleDriveRedirectResult();
    if (redirectResult.status === "none") {
      return;
    }

    handledRef.current = true;

    if (redirectResult.status === "error") {
      void dialog.alert({
        title: "Google Drive authorization failed",
        message: redirectResult.message,
      });
      return;
    }

    window.setTimeout(() => {
      if (redirectResult.action === "publish") {
        void resumeDrivePublishFromRedirect(redirectResult.accessToken);
        return;
      }

      void resumeDriveSaveFromRedirect(redirectResult.action, redirectResult.accessToken);
    }, 0);
  }, [dialog, resumeDrivePublishFromRedirect, resumeDriveSaveFromRedirect]);

  return null;
}
