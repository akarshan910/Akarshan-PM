import { publishHandler } from "../_shared/publish.ts";
import { serve } from "../_shared/runtime.ts";

serve(publishHandler);
