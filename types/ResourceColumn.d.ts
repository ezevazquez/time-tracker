export type ResourceColumn<T> = {
  title: string;
  render: (item: T) => React.ReactNode;
};
