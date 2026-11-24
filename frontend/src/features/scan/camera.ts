/** Picking a lens that can focus on a sticker or a bill held close. */

export interface CameraInfo { id: string; label: string }

/** Android Chrome names its lenses "camera2 <n>, facing back|front". Asked for the back camera (`facingMode:
 * environment`), some phones (Samsung) open an ultra-wide or macro lens with fixed focus, which stays blurry up
 * close. The main lens has the lowest number. Null when labels don't follow that pattern (iPhone: keep its choice). */
export function mainBackCamera(cameras: CameraInfo[]): string | null {
  const back = cameras
    .map((c) => ({ id: c.id, n: /camera2? (\d+), facing back/i.exec(c.label)?.[1] }))
    .filter((c): c is { id: string; n: string } => c.n !== undefined)
    .sort((a, b) => Number(a.n) - Number(b.n));
  return back[0]?.id ?? null;
}

function videoTrack(video: HTMLVideoElement): MediaStreamTrack | null {
  const src = video.srcObject;
  return src && 'getVideoTracks' in src ? (src.getVideoTracks()[0] ?? null) : null;
}

/** The camera the video shows now (to skip switching when it already is the main lens). */
export function currentCamera(video: HTMLVideoElement): string | null {
  return videoTrack(video)?.getSettings().deviceId ?? null;
}

// focusMode is in the Media Capture spec extensions, not in lib.dom yet.
type FocusCapabilities = MediaTrackCapabilities & { focusMode?: string[] };
type FocusConstraints = MediaTrackConstraintSet & { focusMode?: string };

/** Ask the lens to keep refocusing (most Android phones support it; some start in a fixed mode). */
export async function keepFocusing(video: HTMLVideoElement): Promise<void> {
  const track = videoTrack(video);
  const caps: FocusCapabilities | undefined = track?.getCapabilities?.();
  if (!track || !caps?.focusMode?.includes('continuous')) return;
  const continuous: FocusConstraints = { focusMode: 'continuous' };
  await track.applyConstraints({ advanced: [continuous] }).catch(() => undefined);
}

/** Did the user (or the browser settings) refuse the camera? qr-scanner hides the reason behind "Camera not found.". */
export async function cameraRefused(e: unknown): Promise<boolean> {
  if (e instanceof DOMException && e.name === 'NotAllowedError') return true;
  const state = await navigator.permissions?.query({ name: 'camera' }).then((p) => p.state, () => null);
  return state === 'denied';
}

/** Start the camera, retrying a few times: right after the scan page is left and opened again (or another app used
 * the camera) Android can report it busy for a moment, and the library gives up at once. A refusal is final. */
export async function startCamera(start: () => Promise<void>, gone: () => boolean, tries = 4, waitMs = 700): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await start();
    } catch (e) {
      if (attempt >= tries || gone() || (await cameraRefused(e))) throw e;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}
