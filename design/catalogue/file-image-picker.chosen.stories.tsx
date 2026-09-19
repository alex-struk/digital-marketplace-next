import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Text } from "@bcgov/design-system-react-components";

// file-image-picker · chosen — the vendor chose "harbour.png" and it is previewed from their own device. Nothing is
// uploaded or stored until they save; when they do, the picture is stored marked readable by anyone and made smaller if
// it is wider or taller than 500 pixels (R-8.13, R-8.28). Choosing again replaces the preview; Cancel discards it.
const meta: Meta = { title: "files/file-image-picker/chosen" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const picture = { display: "grid", gap: "var(--layout-margin-small)", justifyItems: "start" } as const;
const image = { maxWidth: "100%", height: "auto" } as const;

export const Chosen: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <Form validationBehavior="aria" style={stack}>
        <div role="group" aria-labelledby="picture-label" style={picture}>
          <Text elementType="p" id="picture-label">Profile picture (optional)</Text>
          <img
            src="blob:preview-of-harbour.png"
            alt="Preview of harbour.png, your new profile picture"
            style={image}
            data-testid="profile-image-preview"
          />
          <div role="status">
            <Text elementType="p">harbour.png is ready. Save your changes to use it as your profile picture.</Text>
          </div>
          <div id="image-file-rule" data-testid="image-file-rule">
            <Text elementType="p" size="small" color="secondary">
              A JPEG or PNG image, up to 10 MB. A picture wider or taller than 500 pixels is made smaller to fit, keeping its
              proportions. Anyone can see your profile picture, including people who are not signed in.
            </Text>
          </div>
          <FileTrigger acceptedFileTypes={["image/jpeg", "image/png"]}>
            <Button variant="secondary" aria-describedby="image-file-rule" data-testid="change-avatar">
              Choose a different profile picture
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
