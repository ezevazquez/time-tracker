import { defineType, defineField } from "sanity"

export default defineType({
  name: "person",
  title: "Person",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "surname",
      title: "Surname",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isFullTime",
      title: "Full Time",
      type: "boolean",
      description: "Is this person a full-time employee?",
      initialValue: true,
    }),
    defineField({
      name: "timezone",
      title: "Timezone",
      type: "string",
      description: "Optional timezone information",
    }),
    defineField({
      name: "avatar",
      title: "Avatar",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "role",
      media: "avatar",
    },
  },
})
