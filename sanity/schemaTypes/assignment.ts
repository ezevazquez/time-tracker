import { defineType, defineField } from "sanity"

export default defineType({
  name: "assignment",
  title: "Assignment",
  type: "document",
  fields: [
    defineField({
      name: "person",
      title: "Person",
      type: "reference",
      to: [{ type: "person" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "project",
      title: "Project",
      type: "reference",
      to: [{ type: "project" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startDate",
      title: "Start Date",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "End Date",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "hoursPerDay",
      title: "Hours Per Day",
      type: "number",
      validation: (Rule) => Rule.min(1).max(24),
    }),
    defineField({
      name: "startTime",
      title: "Start Time",
      type: "string",
      description: 'Optional start time (e.g., "9am")',
    }),
  ],
})
