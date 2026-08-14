/**
 * Uniform result shape for the admin server actions.
 *
 * Expected failures (validation, a duplicate slug, a signed-out session) come
 * back as data so the form can show a toast; only genuine bugs throw.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function actionOk(): ActionResult<undefined>;
export function actionOk<T>(data: T): ActionResult<T>;
export function actionOk<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function actionError(error: string): ActionResult<never> {
  return { ok: false, error };
}
