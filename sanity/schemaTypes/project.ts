import { defineType, defineField } from "sanity"

export default defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Project Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "client",
      title: "Client Name",
      type: "string",
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
      name: "colorIndex",
      title: "Color Index",
      type: "number",
      description: "Color index for the project (1-8)",
      validation: (Rule) => Rule.required().min(1).max(8).integer(),
      initialValue: 1,
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "client",
    },
  },
})
