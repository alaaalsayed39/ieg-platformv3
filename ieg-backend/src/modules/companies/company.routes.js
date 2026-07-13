const router = require('express').Router();
const ctrl = require('./company.controller');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const { updateCompanySchema } = require('./company.validators');

router.use(authenticate);

/**
 * @swagger
 * /companies/me:
 *   get:
 *     summary: Get the authenticated user's company
 *     description: Returns the Company linked to the authenticated user. 404 if none (e.g. admin accounts).
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company retrieved successfully
 *       404:
 *         description: No company linked to this account
 */
router.get('/me', ctrl.getMe);

/**
 * @swagger
 * /companies/me:
 *   patch:
 *     summary: Update the authenticated user's company profile
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       403:
 *         description: Not the company owner
 *       404:
 *         description: No company linked to this account
 */
router.patch('/me', validate(updateCompanySchema), ctrl.updateMe);

module.exports = router;
