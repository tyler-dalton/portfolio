import raw from "../data/github-analytics.json";
import { buildView, parseSnapshot } from "./github-analytics";

export const analytics = buildView(parseSnapshot(raw));
