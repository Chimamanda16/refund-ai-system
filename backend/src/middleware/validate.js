import { ValidationError } from '../utils/errors.js';

/**
 * validate({ params, query, body }), each value is a zod schema.
 * Parsed (coerced, trimmed) values land on req.validated.{params,query,body}.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    const validated = {};
    const issues = [];

    for (const location of ['params', 'query', 'body']) {
      if (!schemas[location]) continue;
      const result = schemas[location].safeParse(req[location]);
      if (result.success) {
        validated[location] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ location, path: issue.path.join('.'), message: issue.message });
        }
      }
    }

    if (issues.length > 0) return next(new ValidationError(issues));
    req.validated = validated;
    next();
  };
}
