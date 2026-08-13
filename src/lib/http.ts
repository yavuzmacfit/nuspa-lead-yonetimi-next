import { NextRequest, NextResponse } from "next/server";
import { AppError, badRequest } from "./errors";
import { getRepContext } from "./services/reportService";
import "./ensureSeeded";

type RouteContext<P extends Record<string, string>> = { params: Promise<P> };

/** Route handler'ları AppError'a göre JSON hataya çeviren sarmalayıcı. */
export function apiHandler<P extends Record<string, string> = Record<string, string>>(
  fn: (req: NextRequest, ctx: { params: P }) => unknown | Promise<unknown>
) {
  return async (req: NextRequest, rawCtx?: RouteContext<P>) => {
    try {
      const params = rawCtx ? await rawCtx.params : ({} as P);
      const result = await fn(req, { params });
      if (result instanceof NextResponse) return result;
      if (result && typeof result === "object" && "__status" in (result as Record<string, unknown>)) {
        const { __status, ...body } = result as Record<string, unknown>;
        return NextResponse.json(body, { status: __status as number });
      }
      return NextResponse.json(result ?? null);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { error: err.message, code: err.code, details: err.details },
          { status: err.status }
        );
      }
      console.error(err);
      return NextResponse.json(
        { error: "Beklenmeyen bir hata oluştu.", detail: err instanceof Error ? err.message : String(err) },
        { status: 500 }
      );
    }
  };
}

export function withStatus<T extends object>(body: T, status: number): T & { __status: number } {
  return { ...body, __status: status };
}

/** Basit "giriş yapmış kullanıcı" simülasyonu: header veya query üzerinden salesRepId. */
export function resolveSalesRepId(req: NextRequest): number {
  const raw = req.headers.get("x-sales-rep-id") ?? req.nextUrl.searchParams.get("salesRepId");
  if (raw === null || raw === undefined || raw === "") {
    throw badRequest("salesRepId zorunludur (x-sales-rep-id header veya query).");
  }
  const id = Number(raw);
  if (Number.isNaN(id)) throw badRequest("salesRepId sayısal olmalıdır.");
  return id;
}

export function resolveRepContext(req: NextRequest) {
  return getRepContext(resolveSalesRepId(req));
}
