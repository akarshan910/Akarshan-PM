import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount whatever each test rendered (vitest runs without globals, so RTL can't register this itself).
afterEach(cleanup);
