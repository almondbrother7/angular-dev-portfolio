/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions/v2/options";
import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
// import fetch from "node-fetch";
import cors from "cors";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
// setGlobalOptions({maxInstances: 10});

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


//  Global defaults for all functions
setGlobalOptions({
  maxInstances: 10,
  region: "us-east1",
  timeoutSeconds: 10,
  memory: "256MiB",
});

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error occurred";
}

const corsHandler = cors({origin: true});
const recaptchaSecret = defineSecret("RECAPTCHA_SECRET");

// v2 Cloud Function
export const verifyRecaptcha = onRequest(
  {
    secrets: [recaptchaSecret],
    region: "us-east1",
    timeoutSeconds: 10,
    memory: "256MiB",
  },
  async (req, res) => {
    corsHandler(req, res, async () => {
      const fetch = (await import("node-fetch")).default;
      const {recaptchaToken} = req.body;

      if (!recaptchaToken) {
        return res.status(400).json({success: false, error: "Missing reCAPTCHA token"});
      }

      try {
        const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
          method: "POST",
          headers: {"Content-Type": "application/x-www-form-urlencoded"},
          body: `secret=${recaptchaSecret.value()}&response=${recaptchaToken}`,
        });

        const data: RecaptchaResponse = await response.json() as RecaptchaResponse;

        if (data.success && data.score && data.score >= 0.5) {
          return res.status(200).json({success: true});
        } else {
          return res.status(403).json({success: false, error: data["error-codes"]});
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("[verifyRecaptcha] Error:", error);
        } else {
          console.error("Unknown error:", error);
        }
        return res.status(500).json({
          success: false,
          error: getErrorMessage(error),
        });
      }
    });
  }
);
