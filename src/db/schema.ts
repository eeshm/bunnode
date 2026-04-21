import { index, integer, pgTable, varchar } from "drizzle-orm/pg-core";



export const testing = pgTable(
    "testing",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        name: varchar("name", { length: 255 }).notNull(),
    },
    (table) => ({
        idxTestingName: index("idx_testing_name").on(table.name),
    }),
);