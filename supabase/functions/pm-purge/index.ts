import { purgeHandler } from "../_shared/jobs.ts";
import { serve } from "../_shared/runtime.ts";

serve(purgeHandler);
