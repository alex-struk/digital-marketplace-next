import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Text } from "@bcgov/design-system-react-components";

// file-image-picker · empty — a vendor editing their own profile, with no profile picture stored. A sentence stands in
// place of the picture; the chooser offers only JPEG and PNG files, and the rule and the size limit are stated before a
// file is chosen (R-8.17, R-8.30).
const meta: Meta = { title: "files/file-image-picker/empty" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const picture = { display: "grid", gap: "var(--layout-margin-small)", justifyItems: "start" } as const;

export const Empty: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <Form validationBehavior="aria" style={stack}>
        <div role="group" aria-labelledby="picture-label" style={picture}>
          <Text elementType="p" id="picture-label">Profile picture (optional)</Text>
          <Text elementType="p" size="small" color="secondary">No profile picture has been added.</Text>
          <div id="image-file-rule" data-testid="image-file-rule">
            <Text elementType="p" size="small" color="secondary">
              A JPEG or PNG image, up to 10 MB. A picture wider or taller than 500 pixels is made smaller to fit, keeping its
              proportions. Anyone can see your profile picture, including people who are not signed in.
            </Text>
          </div>
          <FileTrigger acceptedFileTypes={["image/jpeg", "image/png"]}>
            <Button variant="secondary" aria-describedby="image-file-rule" data-testid="change-avatar">
              Choose a profile picture
            </Button>
          </FileTrigger>
        </div>
        <Text elementType="p" size="small" color="secondary">
          Sign-in username, name and email address follow. They are the users domain's design and are not shown here.
        </Text>
        <ButtonGroup ariaLabel="Profile actions">
          <Button type="submit" variant="primary">Save changes</Button>
          <Button variant="secondary">Cancel</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
