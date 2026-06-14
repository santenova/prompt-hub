import React from "react";
import { Toaster as SonnerToaster } from "sonner";

function BaseToaster(props) {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "border border-gray-200",
          title: "font-semibold",
          description: "text-gray-600",
          actionButton: "bg-purple-600 text-white",
          cancelButton: "bg-gray-200",
        },
      }}
      {...props}
    />
  );
}

export const Toaster = BaseToaster;
export default BaseToaster;